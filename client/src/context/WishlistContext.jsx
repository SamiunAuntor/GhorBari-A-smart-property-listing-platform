import { useState, useCallback, useEffect } from 'react';
import useAxiosSecure from '../Hooks/useAxiosSecure';
import useAuth from '../Hooks/useAuth';
import { WishlistContext } from './WishlistContextValue';

const fetchGeoFiles = async () => {
    const [divisionsRes, districtsRes, upzillasRes, thanasRes] = await Promise.all([
        fetch('/divisions.json'),
        fetch('/districts.json'),
        fetch('/upzillas.json'),
        fetch('/thanas.json')
    ]);

    const [divisions, districts, upzillas, thanas] = await Promise.all([
        divisionsRes.json(),
        districtsRes.json(),
        upzillasRes.json(),
        thanasRes.json()
    ]);

    const divisionMap = new Map(divisions.map((d) => [String(d.id), d.name]));
    const districtMap = new Map(districts.map((d) => [String(d.id), d.name]));
    const upzilaMap = new Map([
        ...upzillas.map((u) => [String(u.id), u.name]),
        ...thanas.map((t) => [String(t.id), t.name])
    ]);

    return { divisionMap, districtMap, upzilaMap };
};

const normalizeWishlistProperties = async (items, axiosSecure, token) => {
    if (!Array.isArray(items) || !items.length) return [];

    let geoMaps = {
        divisionMap: new Map(),
        districtMap: new Map(),
        upzilaMap: new Map()
    };
    try {
        geoMaps = await fetchGeoFiles();
    } catch (err) {
        console.error('Failed to fetch geo files for wishlist normalization', err);
    }
    const { divisionMap, districtMap, upzilaMap } = geoMaps;
    const ownerEmails = Array.from(new Set(items.map((p) => p.owner?.email).filter(Boolean)));

    let ownerInfoMap = new Map();
    if (ownerEmails.length) {
        try {
            const ownersRes = await axiosSecure.get(`/users-by-emails?emails=${encodeURIComponent(ownerEmails.join(','))}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(ownersRes.data)) {
                ownersRes.data.forEach((u) => ownerInfoMap.set(u.email, u));
            }
        } catch (err) {
            console.error('Failed to fetch owner info for wishlist normalization', err);
        }
    }

    return items.map((prop) => {
        const imageUrl = Array.isArray(prop.images) && prop.images.length > 0 ? prop.images[0] : prop.image || null;
        const area = prop.areaSqFt ?? prop.area ?? 0;
        const rating = prop.rating?.average ?? prop.rating ?? 0;
        const listingType = prop.listingType ?? 'rent';
        const propertyType = prop.propertyType ?? 'flat';

        let roomCount = prop.roomCount;
        let bathrooms = prop.bathrooms;
        let floorCount = prop.floorCount;
        let totalUnits = prop.totalUnits;

        if (propertyType === 'building') {
            floorCount = prop.floorCount ?? prop.unitCount ?? 0;
            totalUnits = prop.totalUnits ?? 0;
        } else {
            roomCount = prop.roomCount ?? prop.unitCount ?? prop.beds ?? 0;
            bathrooms = prop.bathrooms ?? prop.baths ?? 0;
        }

        const addressObj = prop.address || {};
        const addressString = [
            addressObj.street,
            upzilaMap.get(String(addressObj.upazila_id)) || '',
            districtMap.get(String(addressObj.district_id)) || '',
            divisionMap.get(String(addressObj.division_id)) || ''
        ].filter(Boolean).join(', ');

        const ownerEmail = prop.owner?.email;
        const ownerInfo = ownerInfoMap.get(ownerEmail) || {};
        const ownerRating = ownerInfo.rating?.average ?? ownerInfo.rating ?? 0;
        const ownerNidVerified = !!ownerInfo.nidVerified;
        const isVerified = !!prop.isOwnerVerified || ownerNidVerified;
        const isPremium = (listingType === 'rent' && Number(prop.price) > 50000) || (listingType === 'sale' && Number(prop.price) > 100000);

        return {
            ...prop,
            image: imageUrl,
            area,
            rating,
            listingType,
            propertyType,
            roomCount,
            bathrooms,
            floorCount,
            totalUnits,
            addressString,
            ownerRating,
            ownerNidVerified,
            isVerified,
            isPremium
        };
    });
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const axiosSecure = useAxiosSecure();
    const { user } = useAuth();

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setWishlistItems([]);
            return;
        }
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await axiosSecure.get('/user-wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                const normalized = await normalizeWishlistProperties(res.data, axiosSecure, token);
                setWishlistItems(normalized);
            } else {
                setWishlistItems([]);
            }
        } catch (err) {
            console.error('Failed to fetch wishlist', err);
            setWishlistItems([]);
        } finally {
            setLoading(false);
        }
    }, [axiosSecure, user]);

    const add = useCallback(async (propertyId, note = '') => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await axiosSecure.post('/wishlist/add', { propertyId, note }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchWishlist();
        } catch (err) {
            console.error('Failed to add to wishlist', err);
            throw err;
        }
    }, [axiosSecure, user, fetchWishlist]);

    const remove = useCallback(async (propertyId) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await axiosSecure.delete(`/wishlist/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // compare string forms to avoid mismatches between ObjectId and string
            setWishlistItems(prev => prev.filter(p => p._id?.toString() !== propertyId?.toString()));
        } catch (err) {
            console.error('Failed to remove from wishlist', err);
            throw err;
        }
    }, [axiosSecure, user]);

    const updateNote = useCallback(async (propertyId, note) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await axiosSecure.patch(`/wishlist/${propertyId}`, { note }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlistItems(prev => prev.map(p => {
                if (p._id?.toString() === propertyId?.toString()) {
                    return { ...p, wishlistNote: note };
                }
                return p;
            }));
        } catch (err) {
            console.error('Failed to update wishlist note', err);
            throw err;
        }
    }, [axiosSecure, user]);

    const isInWishlist = useCallback((propertyId) => {
        return wishlistItems.some(p => p._id?.toString() === propertyId?.toString());
    }, [wishlistItems]);

    const toggle = useCallback(async (propertyId, note = '') => {
        if (isInWishlist(propertyId)) {
            await remove(propertyId);
        } else {
            await add(propertyId, note);
        }
    }, [isInWishlist, add, remove]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist, user]);

    const value = {
        wishlistItems,
        loading,
        fetchWishlist,
        add,
        remove,
        updateNote,
        isInWishlist,
        toggle
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

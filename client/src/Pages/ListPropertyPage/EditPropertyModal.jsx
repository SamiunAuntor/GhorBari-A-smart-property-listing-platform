import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxios from "../../Hooks/useAxios";
import MapPicker from "../../Components/MapPicker";
import useAuth from "../../Hooks/useAuth";
import {
    X, Layers, CheckCircle, Info, Upload, Image as ImageIcon, Loader2, MapPin
} from "lucide-react";
import { uploadImageToImgBB } from "../../Utilities/UploadImage";
import { showToast } from "../../Utilities/ToastMessage";
import Swal from 'sweetalert2';

const AMENITIES = [
    "Air Conditioning", "Parking Space", "24/7 Security", "Elevator",
    "Backup Generator", "Gas Connection", "Water Supply", "Balcony",
    "CCTV", "Fire Safety", "Playground", "Gym",
    "Electricity Connection", "Internet/WiFi", "Fully Furnished"
];

const modalAlertOptions = {
    target: document.body,
    customClass: {
        container: 'z-[11000]'
    }
};

const EditPropertyModal = ({ isOpen, onClose, property, onSuccess }) => {
    const { user } = useAuth();
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
    const [mapView, setMapView] = useState({ center: [23.6850, 90.3563], zoom: 7 });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const axios = useAxios();

    // Initialize form when property changes
    useEffect(() => {
        if (property && isOpen) {
            const initialData = {
                price: property.price || "",
                areaSqFt: property.areaSqFt || "",
                overview: property.overview || "",
                amenities: property.amenities || [],
                coordinates: property.location || { lat: 23.6850, lng: 90.3563 }
            };

            // Set dynamic fields based on property type
            if (property.propertyType === "building") {
                initialData.floorCount = property.floorCount || "";
                initialData.totalUnits = property.totalUnits || "";
            } else if (property.propertyType === "flat") {
                initialData.roomCount = property.roomCount || "";
                initialData.bathrooms = property.bathrooms || "";
            }

            reset(initialData);
            setExistingImages(property.images || []);
            setSelectedFiles([]);
            if (property.location) {
                setMapView({ center: [property.location.lat, property.location.lng], zoom: 15 });
                setValue("coordinates", property.location);
            }
        }
    }, [property, isOpen, reset, setValue]);

    const watchCoords = watch("coordinates");

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data) => {
        if (!watchCoords) return showToast("Please pin your location on the map", "error");
        
        // Ensure at least one image remains
        if (existingImages.length === 0 && selectedFiles.length === 0) {
            return showToast("Please keep at least one image", "error");
        }

        setIsSubmitting(true);
        try {
            const uploadedUrls = [];
            
            // Upload new files
            for (let file of selectedFiles) {
                const url = await uploadImageToImgBB(file);
                uploadedUrls.push(url);
            }

            // Combine existing and new images
            const allImages = [...existingImages, ...uploadedUrls];

            const token = await user?.getIdToken();
            const payload = {
                price: Number(data.price),
                areaSqFt: Number(data.areaSqFt),
                images: allImages,
                overview: data.overview,
                amenities: data.amenities || [],
                location: {
                    lat: data.coordinates.lat,
                    lng: data.coordinates.lng
                }
            };

            // Dynamic fields based on property type
            if (property.propertyType === "building") {
                payload.floorCount = Number(data.floorCount);
                payload.totalUnits = Number(data.totalUnits);
            } else if (property.propertyType === "flat") {
                payload.roomCount = Number(data.roomCount);
                payload.bathrooms = Number(data.bathrooms);
            }

            await axios.put(`/property/${property._id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                title: 'Success!',
                text: 'Property has been updated successfully.',
                icon: 'success',
                confirmButtonColor: '#f97316',
                ...modalAlertOptions
            });
            
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: error.response?.data?.message || 'Failed to update property',
                icon: 'error',
                confirmButtonColor: '#f97316',
                ...modalAlertOptions
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const labelStyle = "block text-xs font-bold text-gray-500 mb-2 ml-1 uppercase tracking-widest";
    const inputStyle = (name) => `w-full px-4 py-3 bg-gray-50/50 border ${errors[name] ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/5'} rounded-md focus:bg-white focus:ring-4 outline-none transition-all text-gray-700 font-medium placeholder:text-gray-400`;
    const sectionTitle = "text-xl font-bold text-gray-800 flex items-center gap-2 mb-6";
    const sectionCard = "bg-white rounded-lg p-8 shadow-sm border border-gray-100";

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#111827]/55 backdrop-blur-sm p-4 md:p-8">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl border border-white/60 overflow-hidden max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-[#f9fafb]/95 backdrop-blur-md border-b border-gray-200 px-6 md:px-8 py-5 flex items-center justify-between z-20">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">Edit <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Property</span></h2>
                        <p className="text-sm font-medium text-gray-500 mt-3">Update your listing without changing its current workflow.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-11 h-11 flex items-center justify-center hover:bg-white rounded-2xl transition-colors border border-gray-200 shadow-sm"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-7 space-y-8">
                    {/* Specifications */}
                    <div className={sectionCard}>
                        <h3 className={sectionTitle}><Layers className="text-orange-500" size={20} /> Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-orange-50/50 p-6 rounded-md border border-orange-100 md:col-span-2">
                                <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block">
                                    {property?.listingType === "rent" ? "Monthly Rent" : "Asking Price"} (BDT)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register("price", { required: "Price is required", min: { value: 0, message: "Cannot be negative" } })}
                                    className="w-full bg-transparent border-none text-3xl font-black text-gray-900 outline-none placeholder:text-orange-200"
                                    placeholder="000,000"
                                />
                                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                    {property?.propertyType === "flat" ? (
                                        <>
                                            <div>
                                                <label className={labelStyle}>Rooms</label>
                                            <input
                                                type="number"
                                                min="1"
                                                {...register("roomCount", { required: "Required", min: 1 })}
                                                className={inputStyle("roomCount")}
                                                placeholder="Count"
                                            />
                                            {errors.roomCount && <p className="text-red-500 text-xs mt-1">{errors.roomCount.message}</p>}
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Baths</label>
                                            <input
                                                type="number"
                                                min="1"
                                                {...register("bathrooms", { required: "Required", min: 1 })}
                                                className={inputStyle("bathrooms")}
                                                placeholder="Count"
                                            />
                                            {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>}
                                        </div>
                                    </>
                                ) : property?.propertyType === "building" ? (
                                    <>
                                        <div>
                                            <label className={labelStyle}>Floors</label>
                                            <input
                                                type="number"
                                                min="1"
                                                {...register("floorCount", { required: "Required", min: 1 })}
                                                className={inputStyle("floorCount")}
                                                placeholder="Count"
                                            />
                                            {errors.floorCount && <p className="text-red-500 text-xs mt-1">{errors.floorCount.message}</p>}
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Total Units</label>
                                            <input
                                                type="number"
                                                min="1"
                                                {...register("totalUnits", { required: "Required", min: 1 })}
                                                className={inputStyle("totalUnits")}
                                                placeholder="Count"
                                            />
                                            {errors.totalUnits && <p className="text-red-500 text-xs mt-1">{errors.totalUnits.message}</p>}
                                        </div>
                                    </>
                                    ) : (
                                        <div className="col-span-2 text-sm text-gray-500">Property type not set</div>
                                    )}
                                </div>
                            <div className="md:col-span-2">
                                <label className={labelStyle}>Area (Sq Ft)</label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register("areaSqFt", { required: "Area is required", min: { value: 0, message: "Cannot be negative" } })}
                                    className={inputStyle("areaSqFt")}
                                    placeholder="e.g. 1500"
                                />
                                {errors.areaSqFt && <p className="text-red-500 text-xs mt-1">{errors.areaSqFt.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Overview */}
                    <div className={sectionCard}>
                        <h3 className={sectionTitle}><Info className="text-orange-500" size={20} /> Detailed Overview</h3>
                        <textarea
                            {...register("overview", { required: "Detailed description is required", minLength: { value: 20, message: "Please describe in at least 20 characters" } })}
                            className={`${inputStyle("overview")} min-h-[210px] py-4 resize-none`}
                            placeholder="Describe your property's best features..."
                        />
                        {errors.overview && <p className="text-red-500 text-xs mt-2 ml-1">{errors.overview.message}</p>}
                    </div>

                    {/* Location Map */}
                    <div className={sectionCard}>
                        <h3 className={sectionTitle}><MapPin className="text-orange-500" size={20} /> Location</h3>
                        <div className={`rounded-lg overflow-hidden border ${!watchCoords && errors.submitCount > 0 ? 'border-red-300' : 'border-gray-100'} h-[400px] shadow-inner relative`}>
                            <MapPicker setValue={setValue} flyTo={mapView} />
                        </div>
                        {!watchCoords && <p className="text-red-500 text-xs mt-2 ml-1">Please click on the map to set location</p>}
                    </div>
                    </div>

                    <div className="xl:col-span-5 space-y-8">
                    {/* Images */}
                    <div className={sectionCard}>
                        <h3 className={sectionTitle}><ImageIcon className="text-orange-500" size={20} /> Property Media</h3>
                        
                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mb-6">
                                <label className={labelStyle}>Current Images</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {existingImages.map((url, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={url} alt={`existing-${idx}`} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload New Images */}
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-100 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors group">
                            <Upload className="text-gray-300 group-hover:text-orange-400 transition-colors mb-2" size={32} />
                            <span className="text-xs font-bold text-gray-400 group-hover:text-orange-500 uppercase tracking-tighter">Click to add more images</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFilesChange} />
                        </label>

                        {/* New File Previews */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-6">
                                <label className={labelStyle}>New Images</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="relative">
                                            <img src={URL.createObjectURL(file)} alt={`new-${idx}`} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Amenities */}
                    <div className={sectionCard}>
                        <h3 className={sectionTitle}><CheckCircle className="text-orange-500" size={20} /> Amenities</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {AMENITIES.map(item => (
                                <label key={item} className="flex items-center gap-3 cursor-pointer group rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-orange-50 hover:border-orange-100 transition-all">
                                    <input
                                        type="checkbox"
                                        value={item}
                                        {...register("amenities")}
                                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20 transition-all"
                                    />
                                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-8 mt-8 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-white text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-lg ${
                                isSubmitting
                                    ? 'bg-orange-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 active:scale-95'
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    Updating...
                                </span>
                            ) : (
                                "Update Property"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPropertyModal;

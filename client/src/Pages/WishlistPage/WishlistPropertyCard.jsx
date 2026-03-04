import React from "react";
import { Bed, Bath, Square, MapPin, Star, CheckCircle, XCircle, Tag, Layers } from "lucide-react";

const WishlistPropertyCard = ({
    property,
    isEditing,
    tempNote,
    onTempNoteChange,
    onEditNote,
    onSaveNote,
    onCancelEdit,
    onRemove,
}) => {
    const {
        title,
        price,
        area,
        image,
        images = [],
        addressString,
        listingType,
        propertyType,
        owner,
        ownerRating,
        ownerNidVerified,
        isOwnerVerified,
        verified,
        isPremium,
        roomCount,
        bathrooms,
        floorCount,
        totalUnits,
        unitCount,
        baths,
    } = property;

    const imageUrl = Array.isArray(images) && images.length > 0
        ? images[0]
        : image || "https://i.ibb.co.com/zTBXMRzq/4284558.jpg";
    const displayAddress = addressString || "Unknown location";
    const ownerName = owner?.name || owner?.email || "Unknown";
    const priceSuffix = listingType === "sale" ? " / total" : " / month";
    const premiumFlag = typeof isPremium === "boolean"
        ? isPremium
        : (listingType === "rent" ? Number(price) > 50000 : Number(price) > 100000);
    const verifiedFlag = Boolean(ownerNidVerified ?? isOwnerVerified ?? property.isOwnerVerified ?? property.isVerified ?? verified);

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="relative h-52 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                    <span className="bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 uppercase">
                        <Tag size={11} />
                        {listingType}
                    </span>
                    {premiumFlag && (
                        <span className="bg-orange-500 text-white text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                            <Star size={11} fill="currentColor" />
                            Premium
                        </span>
                    )}
                </div>

                <div className="absolute top-3 right-3">
                    <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 border ${verifiedFlag ? "bg-white/70 text-emerald-700 border-emerald-200" : "bg-white/60 text-red-600 border-red-100"}`}
                        style={{ backdropFilter: "saturate(120%) blur(4px)" }}
                    >
                        {verifiedFlag ? <><CheckCircle size={11} /> Verified</> : <><XCircle size={11} /> Unverified</>}
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="flex items-center justify-between gap-2 text-white text-xs">
                        {propertyType === "building" ? (
                            <>
                                <span className="flex items-center gap-1"><Layers size={12} /> {floorCount || unitCount || "N/A"} Floors</span>
                                <span className="flex items-center gap-1"><Bed size={12} /> {totalUnits || "N/A"} Units</span>
                            </>
                        ) : (
                            <>
                                <span className="flex items-center gap-1"><Bed size={12} /> {roomCount || unitCount || "N/A"} Rooms</span>
                                <span className="flex items-center gap-1"><Bath size={12} /> {bathrooms || baths || "N/A"} Baths</span>
                            </>
                        )}
                        <span className="flex items-center gap-1"><Square size={12} /> {area} sqft</span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2">{title}</h3>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 shrink-0">
                        <Star size={12} className="text-amber-500" fill="currentColor" />
                        <span className="text-xs font-bold text-amber-700">{ownerRating || "0"}</span>
                    </div>
                </div>

                <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                    <MapPin size={12} className="inline-block mr-1 -mt-0.5" />
                    {displayAddress}
                </p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-gray-500">Owner</p>
                        <p className="text-xs font-semibold text-gray-800 truncate">{ownerName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-slate-900">Tk {price}</p>
                        <p className="text-[11px] text-gray-500">{priceSuffix}</p>
                    </div>
                </div>
            </div>

            <div className="p-5 bg-gray-50/40 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Personal Note</span>
                </div>

                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={tempNote}
                            onChange={(e) => onTempNoteChange(e.target.value)}
                            placeholder="What did you like about this property?"
                            className="w-full text-sm border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none bg-white shadow-inner"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={onSaveNote}
                                className="flex-1 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Save Note
                            </button>
                            <button
                                onClick={onCancelEdit}
                                className="px-4 py-2 bg-white text-gray-500 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600 leading-relaxed min-h-[40px]">
                            {property.wishlistNote ? (
                                property.wishlistNote
                            ) : (
                                <span className="italic text-gray-300">Add a note for yourself...</span>
                            )}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                            <button
                                onClick={onEditNote}
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={onRemove}
                                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Remove
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPropertyCard;

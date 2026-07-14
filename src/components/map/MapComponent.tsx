"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// Fix for default marker icons in Next.js
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";

const DefaultIcon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    onLocationSelect: (lat: number, lng: number) => void;
    markerPosition: [number, number] | null;
}

// Component to handle map clicks
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to update map view when center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MapComponent({ center, zoom, onLocationSelect, markerPosition }: MapComponentProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
            scrollWheelZoom={true}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onMapClick={onLocationSelect} />
            <ChangeView center={center} zoom={zoom} />
            {markerPosition && <Marker position={markerPosition} />}
        </MapContainer>
    );
}

export interface IStation {
    name: string;
    description?: string;
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    address?: string;
    donationUrl?: string;
    profile_image?: string;
    cover_image?: string;
    createdAt: Date;
    updatedAt: Date;
}

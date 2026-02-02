import { Station } from '../modules/station/station.model';

const seedStation = async () => {
    const stationData = {
        name: 'Default Station',
        description: 'This is the default station.',
        location: {
            type: 'Point',
            coordinates: [0, 0],
        },
        address: '123 Default St, City, Country',
        donationUrl: 'https://defaultstation.donate',
        profile_image: '',
        cover_image: '',
    };

    const existingStation = await Station.findOne();
    if (!existingStation) {
        await Station.create(stationData);
        console.log('Default station seeded.');
    } else {
        console.log('Station already exists. Skipping seeding.');
    }
};

export default seedStation;

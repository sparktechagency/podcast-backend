/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import httpStatus from 'http-status';
import AppError from './app/error/appError';
import {
    generateMultiplePresignedUrls,
    generatePresignedUrl,
} from './app/helper/presignedUrlGenerator';
import sendContactUsEmail from './app/helper/sendContactUsEmail';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import { ILiveSession } from './app/modules/liveSession/liveSession.interface';
import LiveSessionServices from './app/modules/liveSession/liveSession.service';
import router from './app/routes';
import redis from './app/utilities/redisClient';
const app: Application = express();
dotenv.config();

// parser---------
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:3004',
            'http://localhost:3005',
            'http://localhost:3006',
            'http://localhost:3007',
            'http://localhost:3008',
            'http://54.166.91.237:3001',
            'http://54.166.91.237',
            'http://54.166.91.237:4173',
            'http://54.166.91.237:3000',
            'http://192.168.0.16:3002',
            'http://192.168.0.16:3003',
            'http://192.168.0.16:3004',
            'http://10.10.20.60:3003',
        ],
        credentials: true,
    })
);
app.use('/uploads', express.static('uploads'));
// application routers ----------------
app.use('/', router);
app.post('/contact-us', sendContactUsEmail);

app.get('/', async (req, res) => {
    res.send({ message: 'Welcome to podcast  22222' });
});

app.post('/webhooks/100ms', async (req, res) => {
    const event = req.body;

    console.log('=========================================>', event.data);

    if (event.type === 'session.open.success') {
        const data = event.data;
        const payload: Partial<ILiveSession> = {
            room_id: data.room_id,
            session_id: data.session_id,
            session_started_at: data.session_started_at,
        };
        await LiveSessionServices.createLiveSession(payload);
    }
    if (event.type === 'beam.recording.success') {
        const data = event.data;
        const path = data.recording_path.replace(
            's3://podcast-appp-bucket',
            ''
        );
        const cloudFontUrl = `${process.env.CLOUDFRONT_URL}${path}`;

        await LiveSessionServices.endSession(
            data.session_id,
            cloudFontUrl,
            data.duration
        );
    }

    if (event.type === 'recording.success') {
        const assets = event.data.recording_assets;

        // Save recordings in DB
        // Example: store asset.url for frontend to access
        console.log('Recording ready:', assets);
    }

    res.sendStatus(200);
});

app.get('/redis-health', async (req, res) => {
    try {
        const result = await redis.ping(); // Should return "PONG"
        res.json({ status: 'ok', redis: result });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Redis not connected',
            error,
        });
    }
});

// for s3 bucket--------------
app.post('/generate-presigned-url', async (req, res) => {
    const { fileType, fileCategory } = req.body;
    if (!fileType || !fileCategory) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'File type and file category is required'
        );
    }

    try {
        const result = await generatePresignedUrl({ fileType, fileCategory });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error generating pre-signed URL' });
    }
});

app.post('/generate-multiple-presigned-urls', async (req, res) => {
    const { files } = req.body;

    try {
        const result = await generateMultiplePresignedUrls(files);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            message: 'Error generating multiple pre-signed URLs',
        });
    }
});

// import {
//     DescribeEndpointsCommand,
//     MediaConvertClient,
// } from '@aws-sdk/client-mediaconvert';

// const client = new MediaConvertClient({ region: 'us-east-1' });

// async function getEndpoint() {
//     const response = await client.send(
//         new DescribeEndpointsCommand({ MaxResults: 1 })
//     );
//     console.log('Your MediaConvert endpoint:', response.Endpoints?.[0]?.Url);
// }

// getEndpoint();

// global error handler
app.use(globalErrorHandler);
// not found---------
app.use(notFound);

export default app;

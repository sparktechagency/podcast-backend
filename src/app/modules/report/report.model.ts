import { model, Schema } from 'mongoose';
import { ENUM_INCIDENT_TYPE } from '../../utilities/enum';
import { IReport } from './report.interface';

const ReportSchema = new Schema<IReport>(
    {
        reportFrom: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'reportFromModel',
        },
        reportFromModel: {
            type: String,
            required: true,
            enum: ['NormalUser', 'Creator'],
        },

        reportTo: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'reportToModel',
        },
        reportToModel: {
            type: String,
            required: true,
            enum: ['NormalUser', 'Creator'],
        },

        incidentType: {
            type: String,
            enum: Object.values(ENUM_INCIDENT_TYPE),
            required: true,
        },
        additionalNote: {
            type: String,
        },
    },
    { timestamps: true }
);

const Report = model<IReport>('Report', ReportSchema);

export default Report;

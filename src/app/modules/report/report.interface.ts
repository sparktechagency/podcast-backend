import { Types } from 'mongoose';
import { ENUM_INCIDENT_TYPE } from '../../utilities/enum';

export interface IReport {
    reportFrom: Types.ObjectId;
    reportTo: Types.ObjectId;
    incidentType: (typeof ENUM_INCIDENT_TYPE)[keyof typeof ENUM_INCIDENT_TYPE];
    additionalNote: string;
    reportFromModel: string;
    reportToModel: string;
}

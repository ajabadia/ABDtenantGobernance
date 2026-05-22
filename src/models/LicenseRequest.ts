import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILicenseRequest extends Document {
  tenantId: string;
  appId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  requestedBy: string; // email del administrador que solicita
  resolvedBy?: string; // email del superadmin que aprueba/deniega
  resolvedAt?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseRequestSchema = new Schema<ILicenseRequest>({
  tenantId: { type: String, required: true, index: true },
  appId: { type: String, required: true, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'DENIED'], default: 'PENDING', index: true },
  requestedBy: { type: String, required: true },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  comments: { type: String }
}, {
  timestamps: true
});

// Índice único parcial para evitar duplicados pendientes
LicenseRequestSchema.index({ tenantId: 1, appId: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'PENDING' } 
});

const LicenseRequest: Model<ILicenseRequest> = mongoose.models.LicenseRequest || mongoose.model<ILicenseRequest>('LicenseRequest', LicenseRequestSchema);

export default LicenseRequest;

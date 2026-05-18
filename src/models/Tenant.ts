import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenantBranding {
  logo?: {
    url?: string;
    publicId?: string;
  };
  favicon?: {
    url?: string;
    publicId?: string;
  };
  colors?: {
    primary: string;
    secondary?: string;
    accent?: string;
    primaryDark?: string;
    accentDark?: string;
  };
  autoDarkMode?: boolean;
  rounded?: boolean;
  radius?: string;
}

export interface ITenantBilling {
  fiscalName?: string;
  taxId?: string;
  shippingAddress?: {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface ITenant extends Document {
  tenantId: string;
  name: string;
  industry: string;
  dbPrefix: string;
  isolationStrategy: 'COLLECTION_PREFIX' | 'DATABASE_PER_TENANT';
  active: boolean;
  branding?: ITenantBranding;
  billing?: ITenantBilling;
  customSpaceLabels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TenantMongooseSchema = new Schema<ITenant>({
  tenantId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  industry: { type: String, default: 'Industrial' },
  dbPrefix: { type: String, required: true, minlength: 2 },
  isolationStrategy: { 
    type: String, 
    enum: ['COLLECTION_PREFIX', 'DATABASE_PER_TENANT'], 
    default: 'COLLECTION_PREFIX' 
  },
  active: { type: Boolean, default: true, index: true },
  branding: {
    logo: {
      url: { type: String },
      publicId: { type: String }
    },
    favicon: {
      url: { type: String },
      publicId: { type: String }
    },
    colors: {
      primary: { type: String },
      secondary: { type: String },
      accent: { type: String },
      primaryDark: { type: String },
      accentDark: { type: String }
    },
    autoDarkMode: { type: Boolean, default: true },
    rounded: { type: Boolean, default: true },
    radius: { type: String, default: '0.75rem' }
  },
  billing: {
    fiscalName: { type: String },
    taxId: { type: String },
    shippingAddress: {
      line1: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String }
    }
  },
  customSpaceLabels: [{ type: String }]
}, {
  timestamps: true
});

const Tenant: Model<ITenant> = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantMongooseSchema);

export default Tenant;

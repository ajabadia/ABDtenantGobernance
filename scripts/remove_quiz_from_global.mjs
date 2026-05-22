import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to MongoDB...");
  const connection = await mongoose.connect(uri);
  const db = connection.connection.client.db('ABDElevators-Auth');
  
  console.log("Removing 'quiz' from allowedApps for abd_global tenant...");
  
  // Update abd_global
  const resultGlobal = await db.collection('tenants').updateOne(
    { tenantId: 'abd_global' },
    { $pull: { allowedApps: 'quiz' } }
  );
  console.log(`Updated abd_global: matched ${resultGlobal.matchedCount}, modified ${resultGlobal.modifiedCount}`);

  // Also remove from some other tenant to have a mix, e.g. tenant_02 if it exists
  const resultOther = await db.collection('tenants').updateMany(
    { tenantId: { $in: ['tenant_02', 'tenant_03'] } },
    { $pull: { allowedApps: 'quiz' } }
  );
  console.log(`Updated others: matched ${resultOther.matchedCount}, modified ${resultOther.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch(console.error);

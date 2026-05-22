import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to MongoDB...");
  const connection = await mongoose.connect(uri);
  const db = connection.connection.client.db('ABDElevators-Auth');
  
  console.log("Removing 'quiz' from allowedApps for ALL tenants...");
  
  // Update all tenants
  const result = await db.collection('tenants').updateMany(
    {},
    { $pull: { allowedApps: 'quiz' } }
  );
  console.log(`Updated all tenants: matched ${result.matchedCount}, modified ${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch(console.error);

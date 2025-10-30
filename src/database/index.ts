import mongoose from "mongoose";

interface DbConnectOptions {
  retries?: number;
  delay?: number;
}

const dbConnect = async ({
  retries = 5,
  delay = 5000,
}: DbConnectOptions = {}): Promise<void> => {
  let attempts = 0;

  while (attempts < retries) {
    try {
      const connectionString = process.env.MONGODB_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error(
          "MONGODB_CONNECTION_STRING is not defined in the environment variables"
        );
      }

      mongoose.set("strictQuery", false);

      const conn = await mongoose.connect(connectionString, {});

      console.log(`Database connected to host: ${conn.connection.host}`);
      return;
    } catch (error: unknown) {
      attempts += 1;

      if (attempts >= retries) {
        console.error(
          "Could not connect to the database after multiple attempts. Exiting..."
        );
        process.exit(1);
      } else {
        if (error instanceof Error) {
          console.error(`Attempt ${attempts} failed: ${error.message}`);
        }

        console.log(
          `Retrying database connection in ${
            delay / 1000
          } seconds... (Attempt ${attempts}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
};

export default dbConnect;

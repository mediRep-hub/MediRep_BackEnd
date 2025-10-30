import dotenv from "dotenv";

dotenv.config();

const PORT: number = parseInt(process.env.PORT || "5000", 10);

export { PORT };

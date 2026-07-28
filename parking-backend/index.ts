import express from 'express';
import cors from 'cors';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

interface ParkingSpot {
  id: string;
  title: string;
  price: string;
  published: string;
  acreage: string;
  address: string;
  image: string;
}

let parkingData: ParkingSpot[] = [];

// Load CSV data
const loadCSV = () => {
  const csvFilePath = path.join(__dirname, '../../dn.csv');
  let idCounter = 1;
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      parkingData.push({
        id: idCounter.toString(),
        title: row.title,
        price: row.price,
        published: row.published,
        acreage: row.acreage,
        address: row.address,
        image: `https://images.unsplash.com/photo-1596276020587-804acffc87da?w=500&auto=format&fit=crop&q=60`, // placeholder image
      });
      idCounter++;
    })
    .on('end', () => {
      console.log('CSV file successfully processed, total spots:', parkingData.length);
    });
};

loadCSV();

// Endpoints
app.get('/api/parkings', (req, res) => {
  res.json(parkingData.slice(0, 50)); // Return top 50 to avoid huge payloads
});

app.post('/api/chat', (req, res) => {
  const { query } = req.body;
  // Mock AI behavior
  // Return top 3 results matching the query vaguely or just random top 3
  const top3 = parkingData.slice(0, 3);
  
  res.json({
    message: "Đã tìm thấy",
    results: top3
  });
});

let bookingHistory: any[] = [];

app.post('/api/book', (req, res) => {
  const { spotId, name, phone, time } = req.body;
  const spot = parkingData.find(p => p.id === spotId);
  const newBooking = {
    id: Date.now().toString(),
    spot,
    name,
    phone,
    time,
    status: 'Chờ xác nhận'
  };
  bookingHistory.push(newBooking);
  res.json({ success: true, message: 'Đặt lịch thành công, chờ chủ trọ xác nhận', booking: newBooking });
});

app.get('/api/history', (req, res) => {
  res.json(bookingHistory);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let parkingData = [];
// Load CSV data
const loadCSV = () => {
    const csvFilePath = path_1.default.join(__dirname, '../../dn.csv');
    let idCounter = 1;
    fs_1.default.createReadStream(csvFilePath)
        .pipe((0, csv_parser_1.default)())
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
let bookingHistory = [];
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

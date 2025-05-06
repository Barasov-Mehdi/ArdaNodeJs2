// routes/drivers.js
const express = require('express');
const router = express.Router();
const Drivers = require('../models/Driver');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const haversine = require('haversine');
const TaxiRequest = require('../models/taxiRequest');

router.get('/available-orders/:driverId', async (req, res) => {
    const { lat, lng } = req.body; // The current lat/lng of the driver
    const radius = 0.5; // in kilometers - 500 meters

    try {
        const allOrders = await TaxiRequest.find({ isTaken: false });

        const nearbyOrders = allOrders.filter(order => {
            const distance = haversine(
                { latitude: lat, longitude: lng },
                { latitude: order.coordinates.latitude, longitude: order.coordinates.longitude },
                { unit: 'km' }
            );
            return distance <= radius; // Filter orders within 500 meters
        });

        res.json(nearbyOrders);
    } catch (error) {
        console.error('Error fetching nearby orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

router.get('/:id/current-location', async (req, res) => {
    try {
        const request = await TaxiRequest.findOne({ driverId: req.params.id, isTaken: true }).select('coordinates'); // Assuming you store the driver's active request
        if (!request || !request.coordinates) {
            return res.status(404).json({ message: 'Sürücü koordinatları bulunamadı.' });
        }
        res.json(request.coordinates); // Sending back the driver's coordinates
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Konum alınırken bir hata oluştu.' });
    }
});

router.post('/updateLocation', async (req, res) => {
    try {
        const { driverId, coordinates } = req.body;

        // Sürücü ile ilgili isteği güncelleyin
        const updatedRequest = await TaxiRequest.findOneAndUpdate(
            { driverId, isTaken: true }, // Alınan sipariş
            { coordinates }, // Yeni konum
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Güncelleme yapılacak sipariş bulunamadı.' });
        }

        res.json({ message: 'Konum başarıyla güncellendi.', request: updatedRequest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Konum güncellenirken bir hata oluştu.' });
    }
});

router.post('/register', async (req, res) => {
    const { firstName, lastName, phone, carPlate, carModel, carColor, email, password } = req.body;

    try {
        let driver = await Drivers.findOne({ email });
        if (driver) {
            return res.render('driverRegister', { error: "Driver already exists" });
        }

        driver = new Drivers({
            firstName,
            lastName,
            phone,
            carPlate,
            carModel,
            carColor,
            email,
            password,
            atWork: false,  // Initialize atWork to false
            onOrder: false   // Initialize onOrder to false
        });

        // Hashing the password
        const salt = await bcrypt.genSalt(10);
        driver.password = await bcrypt.hash(password, salt);

        await driver.save();

        return res.render('driverRegister', { success: "Registration successful!" });

    } catch (err) {
        console.error(err.message);
        return res.render('driverRegister', { error: "Server error. Please try again later." });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ msg: 'Driver not found' });
        }

        const { atWork, onOrder, lastOrderId, lastOrderIds } = req.body;

        if (typeof atWork !== 'undefined') {
            driver.atWork = atWork;
        }
        if (typeof onOrder !== 'undefined') {
            driver.onOrder = onOrder;
        }
        if (lastOrderId) {
            driver.lastOrderId = lastOrderId; // Eğer güncellemek isteniyorsa
        }
        if (lastOrderIds && lastOrderIds.length > 0) {
            driver.lastOrderIds.push(...lastOrderIds); // Yeni siparişi diziye ekle
        }

        await driver.save();
        res.json(driver);
    } catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

router.get('/:id/onOrderStatus', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ msg: 'Driver not found' });
        }

        // Send back the `onOrder` status
        res.json({ onOrder: driver.onOrder });
    } catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

router.get('/my-orders/:driverId', async (req, res) => {
    try {
        const requests = await TaxiRequest.find({ driverId: req.params.driverId, isTaken: true });
        if (requests.length === 0) {
            return res.status(404).json({ message: 'Bu sürücü tarafından alınmış sipariş bulunamadı.' });
        }
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Siparişler alınırken bir hata oluştu.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let driver = await Drivers.findOne({ email });
        if (!driver) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            driver: {
                id: driver.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    driver: {
                        id: driver.id,
                        firstName: driver.firstName,
                        lastName: driver.lastName,
                        email: driver.email,
                        // Add any other fields you may want to send
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/profile/:id', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id).select('-password');
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });
        res.json(driver); // Ensure this line matches the format required by the other application
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/:id/updateOrderCount', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id);
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });

        driver.dailyOrderCount += 1; // Günlük sipariş sayısını artır
        await driver.save();
        res.json({ msg: 'Sürücü sipariş sayısı güncellendi', dailyOrderCount: driver.dailyOrderCount });
    } catch (error) {
        console.error("Güncelleme hatası: ", error.message); // Hata konsola yazdır
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

setInterval(async () => {
    try {
        await Drivers.updateMany({}, { dailyOrderCount: 0, dailyEarnings: 0, }); // Tüm sürücülerin sipariş sayısını sıfıra indir
        console.log('Tüm sürücülerin günlük sipariş sayısı sıfırlandı.');
    } catch (error) {
        console.error("Günlük sipariş sayısı sıfırlanırken hata oluştu: ", error);
    }
}, 86400000); // 86400000 milisaniye = 86400000 saniye

router.put('/:id/updateLimit', async (req, res) => {
    let { limit } = req.body; // Limit değeri isteğin gövdesinden alın

    try {
        // Limit değerini bir sayıya dönüştür
        limit = parseFloat(limit);

        // Hatalı limit kontrolü
        if (isNaN(limit)) { // limit artık sayıya dönüştürüldüğünden, sadece NaN kontrol edilecektir
            return res.status(400).json({ msg: 'Geçersiz limit değeri. Lütfen bir sayı girin.' });
        }

        const driver = await Drivers.findById(req.params.id);
        if (!driver) return res.status(404).json({ msg: 'Sürücü bulunamadı.' });

        // Limiti güncelle
        driver.limit = limit;
        await driver.save();

        res.json({ msg: 'Limit başarıyla güncellendi.', limit: driver.limit });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ msg: 'Sunucu hatası', error: error.message });
    }
});

router.get('/:id/limit', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id).select('limit');
        if (!driver) return res.status(404).json({ msg: 'Sürücü bulunamadı.' });

        res.json({ limit: driver.limit }); // Limiti döndür
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

router.get('/get-drivers', async (req, res) => {
    try {
        // firstName, lastName, limit ve _id alanlarını alıyoruz (_id varsayılan olarak gelir)
        const drivers = await Drivers.find().select('firstName lastName limit');
        res.json(drivers);
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

router.post('/:driverId/rate', async (req, res) => {
    const { driverId } = req.params;
    const { rating } = req.body;

    // Puanın doğruluğunu kontrol et
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            message: 'Yanlış veri gönderildi. (1-5 arası puan vermeniz gerekiyor.)'
        });
    }

    try {
        // Sürücüyü bul
        const driver = await Drivers.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Sürücü bulunamadı.' });
        }

        // Verilen puanın sayısını bir artır
        driver.ratingCount[rating] += 1;

        // Sürücüyü güncelle
        await driver.save();

        res.status(200).json({ message: 'Puan başarıyla kaydedildi!' });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Puan kaydedilirken bir hata oluştu.' });
    }
});

router.get('/:driverId/rate', async (req, res) => {
    const { driverId } = req.params;

    try {
        // Sürücüyü bul
        const driver = await Drivers.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Sürücü bulunamadı.' });
        }

        // Puanları al
        const ratingCount = driver.ratingCount;  // ratingCount, her bir puanın kaç kez verildiğini tutuyor
        const totalRatings = Object.values(ratingCount).reduce((acc, count) => acc + count, 0); // Toplam puan sayısı
        const weightedSum = Object.keys(ratingCount).reduce((acc, rating) => acc + (rating * ratingCount[rating]), 0); // Ağırlıklı toplam

        // Ortalama puanı hesapla
        const averageRating = totalRatings > 0 ? (weightedSum / totalRatings).toFixed(2) : 0;

        res.status(200).json({
            averageRating,
            ratingCount
        });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Puanlar alınırken bir hata oluştu.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Sürücü bulunamadı' });
        }
        res.status(200).json(driver);
    } catch (err) {
        res.status(500).json({ message: 'Sunucu hatası', error: err.message });
    }
});

router.put('/:id/updateDailyEarnings', async (req, res) => {
    const { earnings } = req.body;

    try {
        const driver = await Drivers.findById(req.params.id);
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });

        // Update the driver's daily earnings
        driver.dailyEarnings += earnings; // Increment by the order price
        await driver.save();

        res.json({ msg: 'Daily earnings updated.', dailyEarnings: driver.dailyEarnings });
    } catch (error) {
        console.error('Error updating daily earnings:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

router.get('/:id/dailyEarnings', async (req, res) => {
    try {
        const driver = await Drivers.findById(req.params.id);
        if (!driver) return res.status(404).json({ msg: 'Driver not found' });

        res.json({ dailyEarnings: driver.dailyEarnings }); // Return the daily earnings
    } catch (error) {
        console.error('Error fetching daily earnings:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

router.get('/:driverId/last-order-id', async (req, res) => {
    try {
        // Sadece iptal edilmemiş ve 0'dan büyük fiyatı olan en son siparişi al
        const lastOrder = await TaxiRequest.findOne({
            driverId: req.params.driverId,
            status: { $ne: 'canceled' },
            price: { $gt: 0 }  // Fiyatı 0'dan büyük olan siparişler
        })
            .sort({ _id: -1 }) // En son siparişi almak için _id'ye göre azalan sırada
            .select('_id'); // Sadece ID'yi seçelim

        console.log(`Fetched Last Order ID for Driver ID ${req.params.driverId}:`, lastOrder);

        if (!lastOrder) {
            return res.status(404).json({ message: 'Bu sürücü için geçerli sipariş bulunamadı.' });
        }

        res.json({ orderId: lastOrder._id });  // Son siparişin ID'sini döndür
    } catch (error) {
        console.error('Error fetching last order ID:', error);
        res.status(500).json({ message: 'Son sipariş ID\'sini getirirken bir hata oluştu.', error: error.message });
    }
});

// Add this route in your routes/drivers.js file

// routes/drivers.js dosyanıza ekleyin
router.delete('/:id', async (req, res) => {
    try {
        const driver = await Drivers.findByIdAndDelete(req.params.id);
        if (!driver) {
            return res.status(404).json({ msg: 'Driver not found' });
        }
        res.json({ msg: 'Driver removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
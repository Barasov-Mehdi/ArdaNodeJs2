const express = require('express');
const router = express.Router();
const TaxiRequest = require('../models/taxiRequest');
const Driver = require('../models/Driver'); // Sürücü modelini import edin, doğru path kullandığınızdan emin olun
const User = require('../models/User'); // Sürücü modelini import edin, doğru path kullandığınızdan emin olun
// routes/taxis.js 
router.post('/request', async (req, res) => {
  try {
    const { currentAddress, destinationAddress, additionalInfo, additionalData, userId, coordinates, price } = req.body; // price ekledik

    if (!currentAddress || !destinationAddress || !userId || price == null) { // price kontrolü ekledik
      return res.status(400).json({ message: 'Mevcut adres, hedef adres, kullanıcı ID veya fiyat eksik.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.tel || !user.name) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı veya telefon numarası kaydedilmemiş.' });
    }

    const taxiRequest = new TaxiRequest({
      currentAddress,
      destinationAddress,
      additionalInfo,
      additionalData: !!additionalData,
      userId,
      coordinates,
      tel: user.tel,
      name: user.name,
      price // Toplam fiyatı açıktan kaydediyoruz
    });

    const savedRequest = await taxiRequest.save();
    res.status(201).json({ message: 'Taksi isteği başarıyla kaydedildi.', requestId: savedRequest._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Taksi isteği kaydedilirken bir hata oluştu.' });
  }
});

router.delete('/request', async (req, res) => {
  try {
    const { requestId } = req.body; // İstek gövdesinden sipariş ID'sini alırız
    if (!requestId) {
      return res.status(400).json({ message: 'Taksi isteği ID eksik.' });
    }

    const deletedRequest = await TaxiRequest.findByIdAndDelete(requestId);
    if (!deletedRequest) {
      return res.status(404).json({ message: 'Silinecek taksi isteği bulunamadı.' });
    }
    res.sendStatus(204); // Başarıyla silindi
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Taksi isteği silinirken bir hata oluştu.' });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const requests = await TaxiRequest.find();
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Siparişler alınırken bir hata oluştu.' });
  }
});

router.get('/requests/:driverId', async (req, res) => {
  try {
    const requests = await TaxiRequest.find({ driverId: req.params.driverId });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Siparişler alınırken bir hata oluştu.' });
  }
});

router.post('/updatePrice', async (req, res) => {
  try {
    const { requestId, price, driverId, time } = req.body;

    // Sürücü bilgilerini veritabanından al
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Sürücü bulunamadı.' });
    }

    const updatedRequest = await TaxiRequest.findByIdAndUpdate(
      requestId,
      {
        price,
        driverId,
        time,
        driverDetails: {
          id: driver._id,
          firstName: driver.firstName,
          carColor: driver.carColor,
          carModel: driver.carModel,
          carPlate: driver.carPlate,
          phone: driver.phone,
        },

      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    res.json({ message: 'Fiyat ve sürücü bilgileri başarıyla güncellendi.', request: updatedRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fiyat ve sürücü bilgileri güncellenirken bir hata oluştu.' });
  }
});

router.get('/updatePrice', async (req, res) => {
  try {
    const { requestId, price, driverId } = req.query; // URL parametrelerinden alın

    // Sürücü bilgilerini veritabanından al
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Sürücü bulunamadı.' });
    }

    const updatedRequest = await TaxiRequest.findByIdAndUpdate(
      requestId,
      {
        price,
        driverId,
        driverDetails: {
          id: driver._id,
          firstName: driver.firstName, // Dinamik olarak sürücü adını al
          carColor: driver.carColor, // Dinamik olarak sürücü araç rengini al
          carModel: driver.carModel, // Dinamik olarak sürücü modelini al
          carPlate: driver.carPlate, // Dinamik olarak sürücü plakasını al
          phone: driver.phone, // Dinamik olarak sürücü telefonunu al
        },
        time
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    res.json({ message: 'Fiyat ve sürücü bilgileri başarıyla güncellendi.', request: updatedRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fiyat ve sürücü bilgileri güncellenirken bir hata oluştu.' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { requestId } = req.body; // Talep edilen sipariş ID'sini alırız

    if (!requestId) {
      return res.status(400).json({ message: 'Sipariş ID eksik.' });
    }

    // Siparişi güncelle
    const updatedRequest = await TaxiRequest.findByIdAndUpdate(
      requestId,
      {
        isConfirmed: true,        // Onaylandığını bildir
        handleConfirmOrder: true  // Siparişin onaylandığını belirt
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    res.json({ message: 'Sipariş onaylandı.', request: updatedRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sipariş onaylama sırasında bir hata oluştu.' });
  }
});

router.post('/updateConfirmStatus', async (req, res) => {
  try {
    const { requestId, isConfirmed } = req.body;
    if (!requestId) {
      return res.status(400).json({ message: 'Sipariş ID eksik.' });
    }

    const updatedRequest = await TaxiRequest.findByIdAndUpdate(
      requestId,
      { isConfirmed: isConfirmed }, // Onay durumunu güncelle
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    res.json({ message: 'Sipariş durumu güncellendi.', request: updatedRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Bir hata meydana geldi.' });
  }
});

router.get('/order/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const order = await TaxiRequest.findById(requestId);
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sipariş bilgileri alınırken bir hata oluştu.' });
  }
});

router.post('/takeOrder', async (req, res) => {
  try {
    const { requestId, driverId } = req.body;

    // Siparişi bul
    const order = await TaxiRequest.findById(requestId);
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    // Siparişi alınmış olarak işaretle
    order.isTaken = true;
    order.driverId = driverId; // Sürücüyü de atayın (eğer gerekli ise)
    await order.save();

    res.json({ message: 'Sipariş başarıyla alındı.', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sipariş alınırken bir hata oluştu.' });
  }
});

router.get('/userRequests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Belirli bir kullanıcı ID'sine göre taksi taleplerini bulun
    const requests = await TaxiRequest.find({ userId });

    // Debugging için log ekleyebilirsiniz
    console.log(`Kullanıcı ID: ${userId}, Sipariş Sayısı: ${requests.length}`);

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Bu kullanıcıya ait sipariş bulunamadı.' });
    }

    res.json(requests);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ message: 'Siparişler alınırken bir hata oluştu.' });
  }
});

router.get('/my-requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'Kullanıcı ID eksik.' });
    }

    // userId'ye göre sadece o kullanıcıya ait siparişleri getir
    const userRequests = await TaxiRequest.find({ userId });

    res.status(200).json(userRequests);
  } catch (error) {
    console.error('Kullanıcı siparişleri alınırken hata:', error);
    res.status(500).json({ message: 'Kullanıcı siparişleri alınırken bir hata oluştu.' });
  }
});

router.post('/addOrderToUser', async (req, res) => {
  const { userId, requestId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    user.orders.push({ orderId: requestId });
    await user.save();
    res.json({ message: 'Sipariş kullanıcıya eklendi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Hata oluştu' });
  }
});

module.exports = router;
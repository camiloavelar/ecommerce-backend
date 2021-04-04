import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { createBillet, createPixCharge } from './gerencianetHandler.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    if (paymentMethod === 'Billet') {
      const billetInfo = {
        payment: {
          banking_billet: {
            expire_at: '2021-06-12',
            customer: {
              name: req.user.name,
              email: req.user.email,
              cpf: req.user.document,
              birth: '1994-02-08',
              phone_number: req.user.phone_number,
            },
          },
        },
        items: orderItems.map((orderItem) => {
          return {
            name: orderItem.name,
            value: 10000,
            amount: orderItem.qty,
          };
        }),
        shippings: [
          {
            name: 'Default Shipping Cost',
            value: shippingPrice,
          },
        ],
      };

      try {
        const { data } = await createBillet(billetInfo);

        var paymentResult = {
          id: data.charge_id,
          update_time: Date.now(),
          email_address: req.user.email,
          status: data.status,
          billet_link: data.link,
        };
      } catch (err) {
        throw err;
      }
    } else if (paymentMethod === 'Pix') {
      const pixInfo = {
        document: req.user.document,
        name: req.user.name,
        value: String(totalPrice),
        additionalInfo: orderItems.map((orderItem) => {
          return {
            nome: orderItem.name,
            valor: `${orderItem.price}`,
          };
        }),
      };

      const qrCode = await createPixCharge(pixInfo);

      var paymentResult = {
        qr_code: qrCode,
      };
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentResult,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by id
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/user
// @access  Private
const getLoggedUserOders = asyncHandler(async (req, res) => {
  const pageSize = +req.query.pageSize || 2;
  const page = +req.query.page || 1;

  const count = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const pageSize = +req.query.pageSize || 2;
  const page = +req.query.page || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          {
            user: req.query.keyword,
          },
          {
            _id: req.query.keyword,
          },
        ],
      }
    : {};

  const count = await Order.countDocuments({ ...keyword });
  const orders = await Order.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate('user', 'id name');

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getLoggedUserOders,
  getOrders,
  updateOrderToDelivered,
};

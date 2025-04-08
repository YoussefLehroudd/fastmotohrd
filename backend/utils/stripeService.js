require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, currency = 'mad') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      payment_method_types: ['card'],
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

const createCustomer = async (email, paymentMethodId) => {
  try {
    const customer = await stripe.customers.create({
      email: email,
      payment_method: paymentMethodId,
    });
    return customer.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createCustomer
};

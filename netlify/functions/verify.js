const axios = require('axios');

exports.handler = async (event) => {
  const { trackingId } = event.queryStringParameters;
  if (!trackingId) return { statusCode: 400, body: "Missing ID" };

  const isLive = process.env.PESAPAL_ENV === 'live';
  const baseUrl = isLive ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3';

  try {
    // 1. Authenticate
    const auth = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    });
    
    // Extract the token explicitly
    const token = auth.data.token;

    // 2. Get Status
    // Fixed the syntax error in the headers line below
    const statusRes = await axios.get(`${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`, {
      headers: { Authorization: `Bearer ${token}` } 
    });

    // 3. Return Status
    return {
      statusCode: 200,
      body: JSON.stringify({ status: statusRes.data.payment_status_description.toUpperCase() }) 
    };

  } catch (error) {
    console.error("Verify Error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
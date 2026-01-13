const axios = require('axios');

exports.handler = async (event) => {
  const { trackingId } = event.queryStringParameters;
  if (!trackingId) return { statusCode: 400, body: "Missing ID" };

  // ---------------------------------------------------------
  // 🔴 FORCE LIVE URL (Must match pay.js)
  // ---------------------------------------------------------
  const baseUrl = "https://pay.pesapal.com/v3"; 

  try {
    console.log(`--- VERIFYING ON LIVE: ${trackingId} ---`);

    // 1. Authenticate (Live)
    const auth = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json" 
      }
    });
    
    const token = auth.data.token;

    // 2. Get Transaction Status
    const statusRes = await axios.get(`${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Accept": "application/json"
      } 
    });

    const status = statusRes.data.payment_status_description.toUpperCase();
    console.log(`--- STATUS: ${status} ---`);

    // 3. Return Status
    return {
      statusCode: 200,
      body: JSON.stringify({ status: status }) 
    };

  } catch (error) {
    console.error("Verify Error:", error.response ? error.response.data : error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};














/*const axios = require('axios');

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
};*/
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { amount, email, phone, name, orderId } = JSON.parse(event.body);
  
  // ------------------------------------------------------------------
  // 🔴 FORCE LIVE URL
  // We are not checking variables. We are using the Live URL directly.
  // ------------------------------------------------------------------
  const baseUrl = "https://pay.pesapal.com/v3"; 

  // Handle Redirect URL (Localhost vs Live)
  let origin = process.env.URL || "http://localhost:8888";
  if (origin.includes("localhost")) {
      origin = "http://localhost:3000";
  }

  // Handle IPN URL
  const ipnUrl = origin.includes("localhost") 
    ? "https://www.google.com" 
    : `${origin}/.netlify/functions/ipn`;

  try {
    console.log(`--- CONNECTING TO LIVE SERVER: ${baseUrl} ---`);

    // 1. Authenticate (Live Endpoint)
    const auth = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json" 
      }
    });

    if (!auth.data.token) {
        throw new Error("Auth Failed. Check Keys. Response: " + JSON.stringify(auth.data));
    }
    
    const token = auth.data.token;
    console.log("Token Received");

    // 2. Register IPN
    const ipn = await axios.post(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      url: ipnUrl, 
      ipn_notification_type: "GET"
    }, { 
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      } 
    });

    // 3. Submit Order
    const order = await axios.post(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      id: orderId,
      currency: "KES",
      amount: amount,
      description: "Food Order",
      callback_url: `${origin}/order/${orderId}`, 
      notification_id: ipn.data.ipn_id,
      billing_address: { 
          email_address: email, 
          phone_number: phone, 
          first_name: name, 
          country_code: "KE" 
      }
    }, { 
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      } 
    });

    if (!order.data.redirect_url) {
        throw new Error("No Redirect URL. Response: " + JSON.stringify(order.data));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirect_url: order.data.redirect_url })
    };

  } catch (error) {
    console.error("PAYMENT ERROR:", error.response ? error.response.data : error.message);
    
    return { 
        statusCode: 500, 
        body: JSON.stringify({ 
            error: error.message, 
            details: error.response ? error.response.data : "Check Netlify Logs" 
        }) 
    };
  }
};




/*
const axios = require('axios');

exports.handler = async (event) => {
  // 1. Debugging: Check if Netlify can see the keys (Check terminal logs)
  console.log("--- CONFIG CHECK ---");
  console.log("Env Mode:", process.env.PESAPAL_ENV);
  console.log("Key Loaded:", !!process.env.PESAPAL_CONSUMER_KEY); // Should be true
  console.log("Secret Loaded:", !!process.env.PESAPAL_CONSUMER_SECRET); // Should be true

  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { amount, email, phone, name, orderId } = JSON.parse(event.body);
  
  // 2. Dynamic URL Selection based on your .env file
  const isProduction = process.env.PESAPAL_ENV === 'live';
  const baseUrl = isProduction 
    ? "https://pay.pesapal.com/v3" 
    : "https://cybqa.pesapal.com/pesapalv3";

  // Handle Redirect URL
  let origin = process.env.URL || "http://localhost:8888";
  if (origin.includes("localhost")) {
      origin = "http://localhost:3000"; // Frontend port
  }

  // Handle IPN URL
  const ipnUrl = isProduction
    ? `${origin}/.netlify/functions/ipn`
    : "https://www.google.com"; // Sandbox allows dummy URLs

  try {
    console.log(`--- CONNECTING TO: ${baseUrl} ---`);

    // 3. Authenticate
    const auth = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" }
    });

    if (!auth.data.token) {
        throw new Error("Auth Failed. Response: " + JSON.stringify(auth.data));
    }
    
    const token = auth.data.token;
    console.log("Token Received");

    // 4. Register IPN
    const ipn = await axios.post(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      url: ipnUrl, 
      ipn_notification_type: "GET"
    }, { 
      headers: { Authorization: `Bearer ${token}` } 
    });

    // 5. Submit Order
    const order = await axios.post(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      id: orderId,
      currency: "KES",
      amount: amount,
      description: "Food Order",
      callback_url: `${origin}/order/${orderId}`, 
      notification_id: ipn.data.ipn_id,
      billing_address: { 
          email_address: email, 
          phone_number: phone, 
          first_name: name, 
          country_code: "KE" 
      }
    }, { 
      headers: { Authorization: `Bearer ${token}` } 
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ redirect_url: order.data.redirect_url })
    };

  } catch (error) {
    console.error("PAYMENT ERROR:", error.response ? error.response.data : error.message);
    return { 
        statusCode: 500, 
        body: JSON.stringify({ 
            error: error.message, 
            details: error.response ? error.response.data : "Check logs" 
        }) 
    };
  }
};*/
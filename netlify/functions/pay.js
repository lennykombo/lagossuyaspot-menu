const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { amount, email, phone, name, orderId } = JSON.parse(event.body);
  
  // 1. Determine Environment
  const isLive = process.env.PESAPAL_ENV === 'live';
  const baseUrl = isLive 
    ? 'https://pay.pesapal.com/v3' 
    : 'https://cybqa.pesapal.com/pesapalv3';
    
  // 2. Determine Origin (The Redirect URL)
  // Netlify provides the live URL, but locally it defaults to 8888.
  let origin = process.env.URL || "http://localhost:8888";

  // FIX: Force localhost redirects to Port 3001 (React) instead of 8888 (Netlify)
  // This prevents the "White Page" issue when returning from Pesapal.
  if (origin.includes("localhost")) {
      origin = "http://localhost:3000";
  }

  // 3. Handle IPN URL for Localhost
  // Pesapal CANNOT call localhost. If we are testing locally, we send a dummy URL.
  // We use 8888 here specifically for IPN path construction logic if needed, 
  // but for the dummy check, simply checking 'localhost' in origin is enough.
  const ipnUrl = origin.includes("localhost") 
    ? "https://www.google.com" // Dummy URL for testing
    : `${origin}/.netlify/functions/ipn`; // Real URL for Live

  try {
    // --- DEBUG LOGGING ---
    console.log("------------------------------------------------");
    console.log("ENVIRONMENT:", isLive ? "LIVE" : "SANDBOX");
    console.log("REDIRECTING TO:", origin); // Check your terminal to see this!
    console.log("------------------------------------------------");

    // 4. Authenticate
    const auth = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    });

    console.log("PESAPAL AUTH RESPONSE:", auth.data); 

    if (!auth.data.token) {
        throw new Error("Pesapal did not return a token! Response: " + JSON.stringify(auth.data));
    }
    
    const token = auth.data.token;
    console.log("Token received successfully.");

    // 5. Register IPN
    const ipn = await axios.post(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      url: ipnUrl, 
      ipn_notification_type: "GET"
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log("IPN Registered. ID:", ipn.data.ipn_id);

   // 6. Submit Order
    console.log("Submitting Order...");
    
    const order = await axios.post(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      id: orderId,
      currency: "KES",
      amount: amount,
      description: "Food Order",
      
      // Points to http://localhost:3001/order/{id} locally
      callback_url: `${origin}/order/${orderId}`, 
      
      notification_id: ipn.data.ipn_id,
      billing_address: { 
          email_address: email, 
          phone_number: phone, 
          first_name: name, 
          country_code: "KE" 
      }
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log("ORDER RESPONSE:", order.data);

    if (!order.data.redirect_url) {
        throw new Error("No Redirect URL found! Pesapal Response: " + JSON.stringify(order.data));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirect_url: order.data.redirect_url })
    };

  } catch (error) {
    console.error("FULL ERROR:", error.response ? error.response.data : error.message);
    
    return { 
        statusCode: 500, 
        body: JSON.stringify({ 
            error: error.message, 
            details: error.response ? error.response.data : "No details" 
        }) 
    };
  }
};



















/*const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { amount, email, phone, name, orderId } = JSON.parse(event.body);
  
  // 1. Determine URL
  const isLive = process.env.PESAPAL_ENV === 'live';
  const baseUrl = isLive 
    ? 'https://pay.pesapal.com/v3' 
    : 'https://cybqa.pesapal.com/pesapalv3';
    
  // 2. Handle IPN URL for Localhost
  // Pesapal CANNOT call localhost. If we are testing locally, we send a dummy URL
  // just to get the process to work. The IPN won't update your DB, but you can pay.
  const origin = process.env.URL || "http://localhost:8888";
  const ipnUrl = origin.includes("localhost") 
    ? "https://www.google.com" // Dummy URL for testing
    : `${origin}/.netlify/functions/ipn`; // Real URL for Live

  try {
    // --- DEBUG LOGGING ---
    console.log("------------------------------------------------");
    console.log("ENVIRONMENT:", isLive ? "LIVE" : "SANDBOX");
    console.log("Consumer Key Loaded?", process.env.PESAPAL_CONSUMER_KEY ? "YES" : "NO");
    console.log("Consumer Secret Loaded?", process.env.PESAPAL_CONSUMER_SECRET ? "YES" : "NO");
    console.log("------------------------------------------------");

    // 3. Authenticate
    const auth = await axios.post(`${baseUrl}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    });

    // LOG THE ACTUAL RESPONSE FROM PESAPAL
    console.log("PESAPAL AUTH RESPONSE:", auth.data); 

    if (!auth.data.token) {
        throw new Error("Pesapal did not return a token! Response: " + JSON.stringify(auth.data));
    }
    
    const token = auth.data.token;
    console.log("Token received successfully.");

    // 4. Register IPN
    // We use the computed 'ipnUrl' here
    const ipn = await axios.post(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      url: ipnUrl, 
      ipn_notification_type: "GET"
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log("IPN Registered. ID:", ipn.data.ipn_id);

   // 5. Submit Order
    console.log("Submitting Order...");
    
    const order = await axios.post(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      id: orderId,
      currency: "KES",
      amount: amount,
      description: "Food Order",
      
      // ✅ CHANGE THIS LINE: 
      // Instead of /success, point to /order/{orderId}
      // Pesapal will append ?OrderTrackingId=... to this link automatically
      callback_url: `${origin}/order/${orderId}`, 
      
      notification_id: ipn.data.ipn_id,
      billing_address: { 
          email_address: email, 
          phone_number: phone, 
          first_name: name, 
          country_code: "KE" 
      }
    }, { headers: { Authorization: `Bearer ${token}` } });

    // --- DEBUG LOG: WHAT DID PESAPAL SAY? ---
    console.log("ORDER RESPONSE:", order.data);

    if (!order.data.redirect_url) {
        throw new Error("No Redirect URL found! Pesapal Response: " + JSON.stringify(order.data));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirect_url: order.data.redirect_url })
    };

  } catch (error) {
    // Log the full error to the terminal
    console.error("FULL ERROR:", error.response ? error.response.data : error.message);
    
    // Send the detailed error to the frontend so you can see it in the console
    return { 
        statusCode: 500, 
        body: JSON.stringify({ 
            error: error.message, 
            details: error.response ? error.response.data : "No details" 
        }) 
    };
  }
}; */
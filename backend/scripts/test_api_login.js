(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Company-Code': 'NIB01'
      },
      body: JSON.stringify({ email: 'yashwani@gmail.com', password: 'yashwani@123', companyCode: 'NIB01' })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
})();

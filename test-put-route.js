// Teste simples para verificar a rota PUT
const fetch = require('node-fetch');

async function testPutRoute() {
  try {
    console.log('Testando rota PUT...');
    
    const response = await fetch('http://localhost:3000/api/products/800fc2a0-641c-4c9c-9685-ee3405076013', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Pizza Margherita',
        price: 35.9,
        description: 'Teste de atualização'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resposta:', data);
    } else {
      const errorText = await response.text();
      console.log('Erro:', errorText);
    }
    
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

testPutRoute();
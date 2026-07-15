#!/usr/bin/env python3
import urllib.request
import os

url = 'https://femturisme.cat/_fotos/agenda/main/festa-del-quadre-de-santa-rosalia-a-torredembarra.jpg'
output_file = 'uploads/festa-del-quadre.jpg'

# Create uploads directory if it doesn't exist
os.makedirs('uploads', exist_ok=True)

try:
    print('🔗 Descargando imagen...')
    urllib.request.urlretrieve(url, output_file)
    
    # Check file size
    file_size = os.path.getsize(output_file)
    print(f'✅ Imagen descargada')
    print(f'📁 {output_file}')
    print(f'📊 {file_size / 1024:.2f} KB')
except Exception as e:
    print(f'❌ Error: {str(e)}')
    exit(1)

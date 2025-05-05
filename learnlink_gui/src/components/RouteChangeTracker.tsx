import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const RouteChangeTracker = () => {
  const location = useLocation();
  const prevPathRef = useRef<string>('');

  useEffect(() => {
    // İlk render'da önceki path'i saklayalım
    if (prevPathRef.current === '') {
      prevPathRef.current = location.pathname;
      return;
    }

    // Eğer önceki sayfa support sayfası ise
    if (prevPathRef.current === '/support' && location.pathname !== '/support') {
      // Kısa bir gecikme ekleyerek sayfayı yenileyelim
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }

    // Mevcut path'i daha sonra karşılaştırmak için saklayalım
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  return null; // Bu bileşen görsel bir çıktı üretmez
};

export default RouteChangeTracker; 
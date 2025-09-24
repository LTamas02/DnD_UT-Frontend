import React from 'react';
import '../assets/styles/Carousel.css'; // Import Carousel styles
import placeholder from '../assets/img/placeholder.png'; // Adjust the path as necessary


const Carousel = () => {
  return (
    <div className="carousel">
      <div id="carouselExampleSlidesOnly" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src={placeholder} className="d-block w-100 carousel-image" alt="..." />
          </div>
          <div className="carousel-item">
            <img src={placeholder} className="d-block w-100 carousel-image" alt="..." />
          </div>
          <div className="carousel-item">
            <img src={placeholder} className="d-block w-100 carousel-image" alt="..." />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carousel;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '../components/Navbar'; // Assuming you have a Navbar component
import Carousel from '../components/Carousel'; // Assuming you have a Slider component
import Card from '../components/Card'; // Assuming you have a Card component
import '../assets/styles/Navbar.css'; // Import Navbar styles
import '../assets/styles/Home.css'; // Import Home styles
import '../assets/styles/Carousel.css'; // Import Carousel styles

const Home = () => {
    // function renderCards() {
    //       // This function generates 10 cards dynamically
    //       const cards = [];
    //       for (let i = 0; i < 10; i++) {
    //         cards.push(
    //           <Card 
    //             key={i} 
    //             Title={`Card Title ${i + 1}`} 
    //             Subtitle={`Card Subtitle ${i + 1}`} 
    //             Text={`Some quick example text to build on the card title and make up the bulk of the card's content for card ${i + 1}.`} 
    //             Link1="#" 
    //             Link2="#" 
    //           />
    //         );
    //       }
    //       return cards;
    //     }
  return (
    <div id="home-comp" >
      <Navbar />
      <Carousel />
      <h1>Home Page</h1>
      <h1>Welcome to the Home Page!</h1>
      <p>You are logged in.</p>
      {
        // renderCards()
      
      }
      {/* <Card Title="Card Title" Subtitle="Card Subtitle" Text="Some quick example text to build on the card title and make up the bulk of the card's content." Link1="#" Link2="#" /> */}

    </div>
  );
};

export default Home;

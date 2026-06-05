# SpotUWO
SpotUWO is a React + TypeScript web app that helps Western University students find available study spots in real time.

Finding a study spot on campus is a common challenge for university students. Students often spend more time searching than actually studying, spending 20–30 minutes walking between buildings, checking each floor, just to find all the spots already taken. This problem is emphasized during midterms and finals, leading to increased stress levels and precious time wasted. SpotUWO addresses this issue by providing user-sourced, real-time updates on study spot availability across campus. The web app currently includes live updates for 13 buildings on Western's campus, with further information on different spots per building. This allows students to open the app, check the availability, and head straight to studying with ease. 

## Links
Live demo: https://drive.google.com/file/d/1qqUkLYFWALhbLRkIJaQT1jeLSQgeGnd5/view?usp=sharing 
Deployed App: https://spot-uwo.vercel.app/ 

## Screenshots
<img width="1463" height="795" alt="home-screen" src="https://github.com/user-attachments/assets/54681f4b-5d63-4244-8308-659dbc76cbbf" />
<img width="1470" height="801" alt="Screenshot 2026-06-05 at 1 23 49 PM" src="https://github.com/user-attachments/assets/971978de-466a-4bbd-be99-77088f4c0aed" />
<img width="1470" height="800" alt="Screenshot 2026-06-05 at 1 24 03 PM" src="https://github.com/user-attachments/assets/444f260e-4964-4354-9e0f-b54e12d00912" />
<img width="1470" height="802" alt="Screenshot 2026-06-05 at 1 23 38 PM" src="https://github.com/user-attachments/assets/17a55456-9495-47e3-aa29-68a5827730bf" />


## Features
- Interactive campus map using Leaflet + OpenStreetMap
- Building-level study spot listings
- User-sourced availability updates
- Location verification checks when submitting updates
- Upvote/Downvote system to verify users' live updates
- Filters for location and preferences (e.g., “near me”)
- User engagement and incentivization system with points
- Persistent data using localStorage

## Tech Stack
- React + TypeScript
- Tailwind CSS
- Leaflet + OpenStreetMap
- Vite
- Vercel

## Outcome
This project was completed by my teammate and me as part of the ADA Mentorship Program through the Women+ in Technology Society at Western University. SpotUWO was selected as the winning project at the program's final showcase!

## My Contribution
Led development of the frontend architecture using React and TypeScript, implemented the interactive map with custom markers, created layout and visuals for the study spot page, built the study spot data model and filtering system, and designed the user interface and experience.

## Key Learnings
One of the most valuable lessons from this project was realizing that building the application was only part of the challenge, and ensuring the reliability of user-generated data was equally important. Since SpotUWO relies on users to submit real-time availability updates, we identified the risk of inaccurate or misleading submissions that could reduce trust in the platform. To address this, we implemented location-verification checks to confirm that users were physically at a study spot when submitting an update, as well as an upvote/downvote system that allowed other users to validate submissions. Designing these safeguards taught me to think beyond implementation and consider product reliability, user trust, and potential failure points. It reinforced the importance of identifying risks early and building solutions that account for real-world user behavior, not just technical functionality.




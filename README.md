SATCram 

SATcram is a web application I’m building to make SAT preparation a little more organized and manageable.
The idea came from wanting one place where students can keep track of important SAT dates, find study resources, practice, and eventually see how they’re progressing. 

What it does
SATcram is currently focused on the core parts of SAT preparation:
* SAT dates and important deadlines
* Study and preparation resources
* User accounts and authentication
* A preparation dashboard
* Progress tracking
* A responsive interface that works across devices
The project is still a work in progress, and I’m continuously adding and improving features.

 Tech Stack

Frontend

* React
* JavaScript
* HTML
* CSS
* React Router

Backend

* Node.js
* Express.js
* MySQL

Other

* Axios
* Clerk for authentication
* Render for deployment
* Git and GitHub

Running Locally

If you want to run SATcram locally, first clone the repository:

```bash
git clone https://github.com/pxrple6/satcram.git
cd satcram
```

Install the dependencies:

```bash
npm install
```

Create a `.env` file and add the required environment variables.

For example:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_key_here
```

Then start the development server:

```bash
npm start
```

The application should then be available at the local address shown in your terminal.

Why I built it

SAT preparation can get surprisingly scattered. There are registration deadlines, practice tests, study material, scores, and a lot of different resources to keep track of.

I wanted to experiment with building something that brings some of that together in one place.

More importantly, SATcram has been a way for me to learn how a real web application works beyond just the frontend. While building it, I’ve been working with React, APIs, authentication, databases, backend development, and deployment.

What's next

There are still quite a few things I want to add:

* More SAT practice questions
* Personalized study plans
* Performance analytics
* Question explanations
* User profiles
* Study goals and streaks
* More comprehensive Math and Reading & Writing resources

About

SATcram is built by Anusha Garg, a student developer interested in computer science, AI, and building useful things with technology.

GitHub: [@pxrple6](https://github.com/pxrple6)


SATcram is still evolving, so if you come across the project, expect things to change as I keep building it.

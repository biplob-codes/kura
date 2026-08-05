import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <div>
            This is the homepage
            <Link to={"/categories"}>Go to categories</Link>
        </div>
    )
}

export default Home

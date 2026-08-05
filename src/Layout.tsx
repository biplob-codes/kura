import { Outlet } from 'react-router-dom'

const Layout = () => {
    return (
        <div className='grid grid-cols-4'>
            <div className='cols-span-1'>
                The sidebar
            </div>
            <div className='col-span-3 bg-amber-600'>

                <Outlet />
            </div>
        </div>
    )
}

export default Layout

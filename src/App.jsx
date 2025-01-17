import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import HeatMap from './heatmap/HeatMap.jsx';
import Home from './Home.jsx';
import Household from './Household.jsx';
import Layout from './Layout.jsx';
import Report from './Report.jsx';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={ <Layout ><Outlet /> </Layout> } >
        <Route path='/households/:id' element={ <Household /> } />
        <Route path='report' element={ <Report /> } />
        <Route path='/' element={ <Home />} />
      </Route>
      <Route path='/heatmap/*' element={ <HeatMap /> } />
    </>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export { App };

import {BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import NavBar from './components/navBar'
import Dashboard from './components/Dashboard'
import ProductsTable from './components/productsTable'
import AddStudent from './components/AddStudent'
import StudentProfile from './components/StudentProfile'
import PaymentsList from './components/PaymentsList'
import RecordPayment from './components/RecordPayment'
import {ProductProvider} from './ProductContext'

function App() {
  return (
    <div>
      <Router>
        <ProductProvider>
          <NavBar />
          <Switch>
            <Route exact path='/' component={Dashboard} />
            <Route exact path='/dashboard' component={Dashboard} />
            <Route exact path='/students' component={ProductsTable} />
            <Route exact path='/students/add' component={AddStudent} />
            <Route exact path='/students/edit/:id' component={AddStudent} />
            <Route exact path='/students/:id' component={StudentProfile} />
            <Route exact path='/payments' component={PaymentsList} />
            <Route exact path='/payments/add' component={RecordPayment} />
          </Switch>
        </ProductProvider>
      </Router>
    </div>
  );
}

export default App;

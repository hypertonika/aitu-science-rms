import { Link } from 'react-router-dom'
import '../global.css'

const HomePage = () => {
  return (
    <>
      {/* <Navbar /> */}
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="AIU Logo" className="w-32 h-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-aiuBlue">Astana IT University</h1>
            <p className="text-gray-700 mt-4">
              Добро пожаловать в систему оценки научной активности сотрудников университета.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/login" className="block p-4 bg-gray-600 text-white text-center rounded-lg hover:bg-gray-700 transition duration-300">
                Вход в систему
            </Link>
            <Link to="/register" className="block p-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition duration-300">
                Регистрация
            </Link>
          </div>

          <div className="mt-8 text-center text-blue-600">
            <Link className="text-sm hover:underline" to="https://astanait.edu.kz/en/main-page/">
              Сайт AITU
            </Link>{' '}
            |{' '}
            <Link className="text-sm hover:underline" to="/">
              {/* Система "Univer" */}
            </Link>{' '}
            {/* |{' '} */}
            <Link className="text-sm hover:underline" to="/">
              Инструкция по работе с системой
            </Link>
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">&copy AITU Science</p>
        </div>
      </div>
    </>
  )
}

export default HomePage

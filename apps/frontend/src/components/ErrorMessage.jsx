import React from 'react'

export default function ErrorMessage({ message }) {
    if (!message) return null // Если сообщения нет, ничего не отображается

    return (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-500 rounded-lg">
            {message}
        </div>
    )
}

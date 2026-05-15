import { createRoot } from 'react-dom/client'
import { Popup } from '@/popup/popup'
import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(<Popup />)

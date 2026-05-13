import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

export default function CustomDialog({isOpen, title, children,  onClose, }) {

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black bg-opacity-30">
          <DialogPanel className="w-full max-w-[500px] rounded-lg border border-gray-300 bg-white p-6 shadow-xl">
            <DialogTitle className="text-xl font-bold text-gray-800 mb-4">{title}</DialogTitle>
            {/* <Description>This will permanently deactivate your account</Description> */}
            {children}
           
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

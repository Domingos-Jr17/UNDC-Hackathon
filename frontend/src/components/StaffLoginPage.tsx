import StaffLoginForm from './StaffLoginForm'

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-10">
     

        <section className="order-1 flex items-center justify-center lg:justify-start">
          <div className="flex w-full max-w-2xl items-center justify-center rounded-[40px] px-8 py-12 shadow-[0_32px_80px_rgba(30,58,138,0.28)] md:px-12 md:py-16">
            <img
              src="/logo.png"
              alt="WIRA"
              className="h-auto w-full max-w-md object-contain"
            />
          </div>
        </section>
           <section className="order-2 flex justify-center lg:order-1">
          <StaffLoginForm />
        </section>
      </div>
    </div>
  )
}

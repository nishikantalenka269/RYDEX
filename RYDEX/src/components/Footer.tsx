
'use client'

import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6"

function Footer() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <div className='w-full bg-black text-white'>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-16"
      >
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12'>
          <div>
            <h2 className='text-2xl font-bold tracking-wide'>RYDEX</h2>

            <p className='mt-4 text-gray-400 text-sm leading-relaxed'>
              Book any vehicle — from bikes to trucks. Trusted owners. Transparent pricing.
            </p>

            <div className='flex gap-4 mt-6'>
              {[FaFacebookF, FaInstagram, FaXTwitter, FaLinkedinIn].map((Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ y: -3 }}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className='border-t border-white/10'>
          <div className='max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4'>
            <p>© {year ?? ""} RYDEX. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Footer;

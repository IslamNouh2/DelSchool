'use client'
import { Input } from "@/components/ui/input"
import { Search, MessageCircle, Megaphone } from "lucide-react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useTranslations } from 'next-intl'

const Navbar = () => {
    const { setTheme } = useTheme()
    const t = useTranslations('common')
    
    return (
        <div className='flex flex-col gap-4 p-4'>
            <GlobalBreadcrumb />
            <div className='flex items-center justify-between'>
                {/*Search Bar*/}
                <div className="hidden lg:block relative w-full max-w-sm">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input type="search" placeholder={t('search')} className="ps-10"/>
                </div>
                {/*Icons and Users */}
                <div className="flex items-center justify-end gap-6 w-full">
                    <div className="hidden sm:block">
                        <LanguageSwitcher />
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-xs leading-3 font-medium">{t('username')}</span>
                        <span className="text-[10px] text-muted-foreground text-end">{t('admin')}</span>
                    </div>
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    {t('theme_light')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    {t('theme_dark')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    {t('theme_system')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
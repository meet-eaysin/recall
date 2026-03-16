"use client"

import * as React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useArchiveChat, useDeleteChat, useSearchChats } from "@/features/search/hooks"
import { NavUser } from "@/components/nav-user"
import { ApplicationIcon } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarInput,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { SearchIcon, MessageSquareIcon, ArchiveIcon, Trash2Icon, PlusIcon } from "lucide-react"

function SidebarSearch({
  value,
  onChange,
  focusKey,
  onRequestFocus,
}: {
  value: string
  onChange: (value: string) => void
  focusKey: number
  onRequestFocus: () => void
}) {
  const { state, setOpen } = useSidebar()

  return (
    <div className="p-2">
      {state === "collapsed" ? (
        <button
          type="button"
          aria-label="Search"
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          onClick={() => {
            onRequestFocus()
            setOpen(true)
          }}
        >
          <SearchIcon className="size-4" />
        </button>
      ) : (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            key={`search-input-${focusKey}`}
            placeholder="Search chats..."
            className="pl-8"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoFocus={focusKey > 0}
          />
        </div>
      )}
    </div>
  )
}

function SidebarChatList({ query }: { query: string }) {
  const { data: chats, isLoading } = useSearchChats()
  const pathname = usePathname()
  const archiveChat = useArchiveChat()
  const deleteChat = useDeleteChat()

  const filteredChats = React.useMemo(() => {
    if (!chats) return []
    const trimmed = query.trim()
    if (!trimmed) return chats
    const lower = trimmed.toLowerCase()
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(lower) ||
        chat.lastMessagePreview?.toLowerCase().includes(lower)
    )
  }, [chats, query])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupAction
        render={<Link href="/app" />}
        title="New chat"
        aria-label="New chat"
      >
        <PlusIcon />
      </SidebarGroupAction>
      <SidebarMenu className="mt-1 gap-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SidebarMenuItem key={`chat-skeleton-${index}`}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))
          : filteredChats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  render={<Link href={`/app/t/${chat.id}`} />}
                  isActive={pathname.includes(chat.id)}
                  tooltip={chat.title}
                  className="h-auto items-start gap-2 py-2 pr-14"
                >
                  <MessageSquareIcon className="mt-0.5" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{chat.title}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {chat.lastMessagePreview || "No preview available"}
                    </span>
                  </span>
                </SidebarMenuButton>
                <div className="absolute right-1 top-1.5 hidden items-center gap-1 group-hover/menu-item:flex group-focus-within/menu-item:flex group-data-[collapsible=icon]:hidden">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      archiveChat.mutate({ id: chat.id, isArchived: true })
                    }}
                    aria-label={`Archive ${chat.title}`}
                  >
                    <ArchiveIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      deleteChat.mutate(chat.id)
                    }}
                    aria-label={`Delete ${chat.title}`}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </SidebarMenuItem>
            ))}
        {!isLoading && filteredChats.length === 0 && (
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-muted-foreground">
              No chats found.
            </div>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchFocusKey, setSearchFocusKey] = React.useState(0)
  const { state, isMobile, openMobile, setOpen, setOpenMobile } = useSidebar()
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (isMobile) return
    if (state !== "expanded") return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, setOpen, state])

  React.useEffect(() => {
    if (!isMobile || !openMobile) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        setOpenMobile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, openMobile, setOpenMobile])

  return (
    <Sidebar collapsible="icon" {...props}>
      <div ref={sidebarRef} className="flex size-full flex-col">
        <SidebarHeader>
        <ApplicationIcon />
        </SidebarHeader>
        <SidebarContent>
          <SidebarSearch
            value={searchQuery}
            onChange={setSearchQuery}
            focusKey={searchFocusKey}
            onRequestFocus={() => setSearchFocusKey((prev) => prev + 1)}
          />
          <SidebarChatList query={searchQuery} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </div>
    </Sidebar>
  )
}

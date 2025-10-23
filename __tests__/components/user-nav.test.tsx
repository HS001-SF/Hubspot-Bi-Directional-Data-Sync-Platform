import { render, screen, fireEvent } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserNav } from '@/components/layout/user-nav'

// Mock the hooks
jest.mock('next-auth/react')
jest.mock('next/navigation')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('UserNav Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockSignOut.mockResolvedValue(undefined as any)
  })

  it('should render user avatar with initials when no image', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    expect(screen.getByText('JD')).toBeInTheDocument() // Initials
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should render user avatar with image when provided', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
          image: '/uploads/avatars/avatar-1-123.jpg',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    const avatarImage = screen.getByAltText('John Doe')
    expect(avatarImage).toBeInTheDocument()
    expect(avatarImage).toHaveAttribute('src', '/uploads/avatars/avatar-1-123.jpg')
  })

  it('should navigate to profile when profile menu item clicked', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    // Open dropdown
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)

    // Click profile menu item
    const profileItem = screen.getByText('Profile')
    fireEvent.click(profileItem)

    expect(mockRouter.push).toHaveBeenCalledWith('/profile')
  })

  it('should navigate to settings when settings menu item clicked', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    // Open dropdown
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)

    // Click settings menu item
    const settingsItem = screen.getByText('Settings')
    fireEvent.click(settingsItem)

    expect(mockRouter.push).toHaveBeenCalledWith('/settings')
  })

  it('should call signOut when logout menu item clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    // Open dropdown
    const avatarButton = screen.getByRole('button')
    fireEvent.click(avatarButton)

    // Click logout menu item
    const logoutItem = screen.getByText('Log out')
    fireEvent.click(logoutItem)

    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false })
    await new Promise(resolve => setTimeout(resolve, 0)) // Wait for async
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('should display correct initials for single name', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Madonna',
          email: 'madonna@example.com',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    expect(screen.getByText('MA')).toBeInTheDocument() // First two letters
  })

  it('should use email initials when name is not provided', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<UserNav />)

    expect(screen.getByText('TE')).toBeInTheDocument() // Email initials
  })
})

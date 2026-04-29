import { render, screen } from '@testing-library/react'
import ErrorMessage from './ErrorMessage'
import userEvent from '@testing-library/user-event'

describe('ErrorMessage', () => {
  test('renders the error message text', () => {
    render(<ErrorMessage message="Something went wrong" />)

    expect(screen.getByText(/Error: Something went wrong/i)).toBeInTheDocument()
  })

  test('renders close button and calls onClose when clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ErrorMessage message="Test error" onClose={onClose} />)

    const button = screen.getByRole('button', { name: /Close error message/i })
    await user.click(button)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

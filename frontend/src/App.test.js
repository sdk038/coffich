import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders brand name', () => {
  render(<App />);
  expect(screen.getAllByText(/Coffich/i).length).toBeGreaterThan(0);
});

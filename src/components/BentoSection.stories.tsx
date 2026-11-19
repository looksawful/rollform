import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BentoSection from './BentoSection';

const meta = {
  title: 'Sections/Bento',
  component: BentoSection,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BentoSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

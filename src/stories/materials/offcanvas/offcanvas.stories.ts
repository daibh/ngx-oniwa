import { type StoryFn, type Meta, moduleMetadata, applicationConfig } from '@storybook/angular';
import { OffcanvasExampleComponent } from '../../../app/components';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export default {
  title: 'Material/Offcanvas/Primary',
  component: OffcanvasExampleComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [CommonModule],
      declarations: [],
      providers: [],
    })
  ],
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/angular/configure/story-layout
    layout: 'centered',
    options: { showPanel: false }
  },
} as Meta;

const Template: StoryFn<OffcanvasExampleComponent> = (args: OffcanvasExampleComponent) => ({
  props: args
});

export const Primary = Template.bind({});
Primary.args = {
  opened: false,
  position: 'start'
};


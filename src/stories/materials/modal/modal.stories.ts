import { type StoryFn, type Meta, moduleMetadata, applicationConfig } from '@storybook/angular';
import { ModalExampleComponent } from '../../../app/components';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export default {
  title: 'Material/Modal/Primary',
  component: ModalExampleComponent,
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

const Template: StoryFn<ModalExampleComponent> = (args: ModalExampleComponent) => ({
  props: args
});

export const Primary = Template.bind({});
Primary.args = {};


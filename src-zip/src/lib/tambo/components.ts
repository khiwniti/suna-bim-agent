/**
 * Tambo Component Registry
 *
 * Combines HITL generative components and artifact cards for TamboProvider registration.
 * Components use useTamboComponentState for bidirectional AI sync.
 *
 * Component Types:
 * - HITL Components: Confirmation, Choice, Parameter Input
 * - Artifact Cards: Carbon, Clash, BOQ (with "Open Panel →" CTA)
 */

import type React from 'react';
import type { TamboComponent } from '@tambo-ai/react';
import { z } from 'zod';
import {
  ConfirmationCard,
  ChoiceCard,
  ParameterInputCard,
  type ConfirmationCardProps,
  type ChoiceCardProps,
  type ParameterInputCardProps,
} from './hitl-components';
import {
  CarbonArtifactCard,
  ClashArtifactCard,
  BOQArtifactCard,
  carbonArtifactCardPropsSchema,
  clashArtifactCardPropsSchema,
  boqArtifactCardPropsSchema,
  type CarbonArtifactCardProps,
  type ClashArtifactCardProps,
  type BOQArtifactCardProps,
} from './artifact-cards';

/**
 * Component descriptions for AI context
 */
const componentDescriptions: Record<string, string> = {
  ConfirmationCard:
    'A yes/no confirmation card for destructive or important actions. Shows confirm and cancel buttons. The user response (confirmed/cancelled) is synced via component state.',
  ChoiceCard:
    'A multiple choice selection card. User clicks a choice and the selected ID is synced via component state.',
  ParameterInputCard:
    'A parameter input form card. Collects user input for specified parameters. Submitted values are synced via component state.',
  CarbonArtifactCard:
    'An inline carbon analysis result card for chat. Shows total carbon, breakdown by materials/construction/transport, hotspots, and recommendations. Includes "Open Panel →" button that activates the Carbon Dashboard panel with full data.',
  ClashArtifactCard:
    'An inline clash detection result card for chat. Shows total clashes, severity breakdown (critical/high/medium/low), and individual clash details. Includes "Open Panel →" button that activates the Clash Report panel.',
  BOQArtifactCard:
    'An inline Bill of Quantities summary card for chat. Shows total cost (in THB or other currency), item count, categories, and top cost items. Includes "Open Panel →" button that activates the BOQ Table panel.',
};

/**
 * Props schemas for Tambo AI - only serializable props, no functions
 */
const confirmationCardPropsSchema = z.object({
  title: z.string().describe('Title of the confirmation dialog'),
  description: z.string().describe('Description explaining what will happen'),
  confirmLabel: z.string().optional().describe('Label for the confirm button (default: Confirm)'),
  cancelLabel: z.string().optional().describe('Label for the cancel button (default: Cancel)'),
});

const choiceCardPropsSchema = z.object({
  title: z.string().describe('Title of the choice card'),
  description: z.string().describe('Description of the choice'),
  choices: z.array(z.object({
    id: z.string().describe('Unique identifier for the choice'),
    label: z.string().describe('Display label for the choice'),
    description: z.string().optional().describe('Optional description for the choice'),
  })).describe('Array of choices to present to the user'),
});

const parameterInputCardPropsSchema = z.object({
  title: z.string().describe('Title of the input form'),
  description: z.string().describe('Description of what parameters to fill'),
  parameters: z.array(z.object({
    id: z.string().describe('Unique identifier for the parameter'),
    label: z.string().describe('Display label for the parameter'),
    type: z.enum(['text', 'number', 'checkbox', 'select']).describe('Input type'),
    defaultValue: z.string().optional().describe('Default value for the input'),
    options: z.array(z.string()).optional().describe('Options for select type inputs'),
  })).describe('Array of parameters to collect from the user'),
});

/**
 * All Tambo components for TamboProvider registration.
 * HITL components are rendered inline in chat by the AI.
 * Artifact cards show analysis results with "Open Panel →" CTA.
 * User responses are synced via useTamboComponentState internally.
 */
export const tamboComponents: TamboComponent[] = [
  // HITL Components
  {
    name: 'ConfirmationCard',
    description: componentDescriptions.ConfirmationCard,
    component: ConfirmationCard as React.ComponentType<ConfirmationCardProps>,
    propsSchema: confirmationCardPropsSchema,
  },
  {
    name: 'ChoiceCard',
    description: componentDescriptions.ChoiceCard,
    component: ChoiceCard as React.ComponentType<ChoiceCardProps>,
    propsSchema: choiceCardPropsSchema,
  },
  {
    name: 'ParameterInputCard',
    description: componentDescriptions.ParameterInputCard,
    component: ParameterInputCard as React.ComponentType<ParameterInputCardProps>,
    propsSchema: parameterInputCardPropsSchema,
  },
  // Artifact Cards (with "Open Panel →" CTA)
  {
    name: 'CarbonArtifactCard',
    description: componentDescriptions.CarbonArtifactCard,
    component: CarbonArtifactCard as React.ComponentType<CarbonArtifactCardProps>,
    propsSchema: carbonArtifactCardPropsSchema,
  },
  {
    name: 'ClashArtifactCard',
    description: componentDescriptions.ClashArtifactCard,
    component: ClashArtifactCard as React.ComponentType<ClashArtifactCardProps>,
    propsSchema: clashArtifactCardPropsSchema,
  },
  {
    name: 'BOQArtifactCard',
    description: componentDescriptions.BOQArtifactCard,
    component: BOQArtifactCard as React.ComponentType<BOQArtifactCardProps>,
    propsSchema: boqArtifactCardPropsSchema,
  },
];

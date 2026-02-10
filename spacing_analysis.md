# Share Card Spacing Analysis

## Current Issue
- Card padding: 80px all sides
- masterContainer: paddingTop 10, paddingBottom 10
- contentContainer: flex:1 with justifyContent center
- signatureContainer: paddingBottom 20
- Total effective top margin: ~90px + large flex gap
- Total effective bottom margin: ~100px + large flex gap

## Problem
The `justifyContent: 'space-between'` on the card + `flex: 1` on contentContainer creates large gaps between master name, content, and signature.

## Fix Plan
- Reduce card padding from 80 to 40 (top/bottom)
- Keep horizontal padding at 60
- Remove flex:1 from contentContainer, use explicit spacing
- Reduce masterContainer padding
- Reduce signatureContainer padding
